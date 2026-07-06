#pragma once

#include "TaskQueue.hpp"
#include <iostream>
#include <pthread.h>
#include <malloc.h>
#include <cstring>
#include <unistd.h>
#include <string>

// 每次管理线程检查时，最多增减的线程数量。
const int NUMBER = 2;

// 一个基于 pthread 的动态线程池。
// 结构上分成管理线程 + 若干 worker 线程：
// - worker 线程负责真正执行任务
// - manager 线程负责监控队列积压，并决定扩容或缩容
template<typename T>
class Threadpool {
public:
	Threadpool(int min, int max);
	~Threadpool();

	// 往任务队列里投递一个任务。
	void addTask(Task<T> task);

	// 返回当前忙碌线程数。
	int getBusyNum();

	// 返回当前存活线程数。
	int getLiveNum();

private:
	// 管理线程入口。
	static void* manager(void* arg);

	// worker 线程入口。
	static void* worker(void* arg);

	// worker 退出前注销自己。
	void threadExit();

	TaskQueue<T>* taskQ;

	pthread_t manaerID; // 管理线程
	pthread_t* threadIDs; // worker 线程数组

	int minNum; // 最小线程数
	int maxNum; // 最大线程数
	int busyNum; // 正在忙碌的线程数
	int liveNum; // 当前存活线程数
	int exitNum; // 需要销毁的线程数

	pthread_mutex_t mutexpool; // 保护线程池共享状态
	pthread_cond_t notEmpty; // 任务队列非空时唤醒 worker

	bool shutdown; // 是否准备关闭线程池
};

