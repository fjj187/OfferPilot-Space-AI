#include "Pool/threadpool.hpp"

template<typename T>
Threadpool<T>::Threadpool(int min, int max) {
	do {
		// 任务队列由线程池统一创建。
		taskQ = new TaskQueue<T>;
		if (taskQ == nullptr) {
			std::cout << "malloc TaskQueue fail..." << std::endl;
			break;
		}
		threadIDs = new pthread_t[max];
		if (threadIDs == nullptr) {
			std::cout << "malloc threadIDs fail.." << std::endl;
			break;
		}
		// 把线程 ID 数组先清空，后续创建线程时按下标写入。
		memset(threadIDs, 0, sizeof(pthread_t) * max);
		minNum = min;
		maxNum = max;
		busyNum = 0;
		exitNum = 0;
		liveNum = min;
		if (pthread_mutex_init(&mutexpool, NULL) != 0 || pthread_cond_init(&notEmpty, NULL) != 0) {
			std::cout << "mtutex or cond fail..." << std::endl;
			break;
		}
		shutdown = false;
		// 先启动管理线程，再启动最小数量的 worker。
		pthread_create(&manaerID, NULL, manager, this);
		for (int i = 0; i < min; i++) {
			pthread_create(&threadIDs[i], NULL, worker, this);
		}
		return;
	} while (0);

	if (threadIDs) delete[] threadIDs;
	if (taskQ) delete taskQ;
}

template<typename T>
void Threadpool<T>::addTask(Task<T> task) {
	// 这里假设任务队列本身负责内部同步。
	if (this->shutdown) {
		pthread_mutex_unlock(&this->mutexpool);
		return;
	}
	// 任务入队后唤醒一个等待中的 worker。
	this->taskQ->addTask(task);
	pthread_cond_signal(&this->notEmpty);
}

template<typename T>
int Threadpool<T>::getBusyNum() {
	pthread_mutex_lock(&this->mutexpool);
	int busynum = this->busyNum;
	pthread_mutex_unlock(&this->mutexpool);
	return busynum;
}

template<typename T>
int Threadpool<T>::getLiveNum() {
	pthread_mutex_lock(&this->mutexpool);
	int alivenum = this->liveNum;
	pthread_mutex_unlock(&this->mutexpool);
	return alivenum;
}

template<typename T>
void* Threadpool<T>::worker(void* arg) {
	Threadpool* pool = (Threadpool*)arg;
	while (true) {
		pthread_mutex_lock(&pool->mutexpool);
		// 队列为空时进入条件等待，避免空转。
		while (pool->taskQ->taskNumber() == 0 && !pool->shutdown) {
			pthread_cond_wait(&pool->notEmpty, &pool->mutexpool);

			// 收到缩容信号时，允许 worker 自行退出。
			if (pool->exitNum > 0) {
				pool->exitNum--;
				if (pool->liveNum > pool->minNum) {
					pool->liveNum--;
					pthread_mutex_unlock(&pool->mutexpool);
					pool->threadExit();
				}
			}
		}

		// 线程池关闭后，worker 必须退出。
		if (pool->shutdown) {
			pthread_mutex_unlock(&pool->mutexpool);
			pool->threadExit();
		}

		// 先取任务，再执行，避免持锁执行任务导致其他线程被阻塞。
		Task<T> task = pool->taskQ->takeTask();
		pool->busyNum++;
		pthread_mutex_unlock(&pool->mutexpool);

		std::cout << "thread " << pthread_self() << "start working ..." << std::endl;
		if (task.function != nullptr) {
			task.function(task.arg);
		}
		delete(task.arg);
		task.arg = NULL;
		std::cout << "thread " << pthread_self() << "end working ..." << std::endl;

		pthread_mutex_lock(&pool->mutexpool);
		pool->busyNum--;
		pthread_mutex_unlock(&pool->mutexpool);
	}
	return NULL;
}

template<typename T>
void* Threadpool<T>::manager(void *arg) {
	Threadpool* pool = (Threadpool*)arg;
	while (!pool->shutdown) {
		// 每 3 秒观察一次队列和线程利用率。
		sleep(3);

		pthread_mutex_lock(&pool->mutexpool);
		int queueSize = pool->taskQ->taskNumber();
		int liveNum = pool->liveNum;
		int busyNum = pool->busyNum;
		pthread_mutex_unlock(&pool->mutexpool);

		// 队列积压明显且未到上限时，尝试扩容。
		if (queueSize > liveNum && liveNum < pool->maxNum) {
			int count = 0;
			pthread_mutex_lock(&pool->mutexpool);
			for (int i = 0; i < pool->maxNum && count < NUMBER && pool->liveNum < pool->maxNum; i++) {
				if (pool->threadIDs[i] == 0) {
					pthread_create(&pool->threadIDs[i], NULL, worker, pool);
					count++;
					pool->liveNum++;
				}
			}
			pthread_mutex_unlock(&pool->mutexpool);
		}

		// 忙碌线程过少时，尝试缩容。
		if (busyNum * 2 < liveNum && liveNum > pool->minNum) {
			pthread_mutex_lock(&pool->mutexpool);
			pool->exitNum = NUMBER;
			pthread_mutex_unlock(&pool->mutexpool);
			for (int i = 0; i < NUMBER; i++) {
				pthread_cond_signal(&pool->notEmpty);
			}
		}
	}
	return NULL;
}

template<typename T>
void Threadpool<T>::threadExit() {
	pthread_t tid = pthread_self();
	for (int i = 0; i < this->maxNum; i++) {
		if (this->threadIDs[i] == tid) {
			this->threadIDs[i] = 0;
			std::cout << "threadExit() called" << std::to_string(tid) << "exiting .." << std::endl;
			break;
		}
	}
	pthread_exit(NULL);
}

template<typename T>
Threadpool<T>::~Threadpool() {
	// 先通知所有线程准备退出。
	this->shutdown = true;
	pthread_join(this->manaerID, NULL);

	// 唤醒 worker，让它们检查 shutdown 并退出。
	for (int i = 0; i < this->liveNum; i++) {
		pthread_cond_signal(&this->notEmpty);
	}

	// 回收资源。
	if (this->taskQ) delete taskQ;
	if (this->threadIDs) delete[] threadIDs;
	pthread_mutex_destroy(&mutexpool);
	pthread_cond_destroy(&notEmpty);
}

