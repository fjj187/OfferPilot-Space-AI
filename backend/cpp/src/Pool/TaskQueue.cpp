#include "Pool/TaskQueue.hpp"

template<typename T>
TaskQueue<T>::TaskQueue() {
	pthread_mutex_init(&m_mutex, NULL);
}

template<typename T>
TaskQueue<T>::~TaskQueue() {
	pthread_mutex_destroy(&m_mutex);
}

template<typename T>
void TaskQueue<T>::addTask(Task<T> task) {
	// 入队和出队都必须加锁，避免多个 worker 同时修改队列。
	pthread_mutex_lock(&m_mutex);
	m_taskQ.push(task);
	pthread_mutex_unlock(&m_mutex);
}

template<typename T>
void TaskQueue<T>::addTask(void(*f)(void* arg), void* arg) {
	pthread_mutex_lock(&m_mutex);
	m_taskQ.push(Task<T>(f, arg));
	pthread_mutex_unlock(&m_mutex);
}

template<typename T>
Task<T> TaskQueue<T>::takeTask() {
	Task<T> t;
	pthread_mutex_lock(&m_mutex);
	if (!m_taskQ.empty()) {
		t = m_taskQ.front();
		m_taskQ.pop();
	}
	pthread_mutex_unlock(&m_mutex);
	return t;
}

template<typename T>
int TaskQueue<T>::taskNumber() {
	pthread_mutex_lock(&m_mutex);
	int size = m_taskQ.size();
	pthread_mutex_unlock(&m_mutex);
	return size;
}
