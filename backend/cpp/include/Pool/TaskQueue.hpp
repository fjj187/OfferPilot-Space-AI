#pragma once

#include <queue>
#include <pthread.h>

// 线程池任务的最小表达形式：函数指针 + 参数指针。
// 这种写法简单直接，和 pthread 风格的 worker 配合比较自然。
template<typename T>
struct Task {
	Task() {
		function = nullptr;
		arg = nullptr;
	}
	Task(void (*f)(void* arg), void* arg) {
		this->function = f;
		this->arg = arg;
	}
	void (*function)(void* arg);
	void* arg;
};

// 线程安全任务队列。
// 外部线程往里塞任务，worker 线程从这里取任务。
template<typename T>
class TaskQueue
{
public:
	TaskQueue();
	~TaskQueue();
	// 添加一个完整任务对象。
	void addTask(Task<T> task);
	// 通过函数指针和参数快速构造任务。
	void addTask(void(*f)(void* arg), void* arg);
	// 取出一个任务；队列为空时返回默认任务。
	Task<T> takeTask();
	// 当前任务队列长度。
	int taskNumber();
private:
	pthread_mutex_t m_mutex;
	std::queue<Task<T>>m_taskQ;
};

