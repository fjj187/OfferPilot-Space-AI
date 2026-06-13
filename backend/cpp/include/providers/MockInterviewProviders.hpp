#pragma once

#include "InterviewProvider.hpp"
#include <string>
#include <vector>
#include <functional>
#include <memory>
#include <sstream>
#include <thread>

class MockInterviewProvider : public InterviewProvider {
public:
    MockInterviewProvider();

    // 核心接口：流式生成面试反馈
    void streamFeedback(
        const InterviewStreamRequest& request,
        std::function<void(const InterviewStreamEvent&)> callback,
        std::shared_ptr<ProviderContext> context = nullptr) override;

private:
    // ---------- 成员变量 ----------
    int m_chunkSize;                     // 每个 chunk 输出的字符数
    int m_chunkDelayMs;                  // chunk 之间的模拟延迟（毫秒）
    int m_referenceRevealThreshold;      // 连续 unknown 多少次后直接给参考答案
    std::string m_defaultProviderName;   // Provider 标识

    // ---------- 辅助函数 ----------
    bool validateRequest(const InterviewStreamRequest& request) const;// 简单验证请求的必填字段
    bool shouldCancel(std::shared_ptr<ProviderContext> context) const;// 检查上下文中的 cancelFlag 是否被置位
    bool shouldRevealReferenceAnswer(const InterviewStreamRequest& request) const;// 根据请求中的 unknownAnswerStreak 和配置的阈值判断是否应该直接揭示参考答案

    std::string buildReplyText(const InterviewStreamRequest& request) const;// 根据请求中的 feedbackStyle 和其他信息构建回复文本
    std::string buildFollowupReply(const InterviewStreamRequest& request) const;// 构建 followup 风格的回复
    std::string buildCorrectiveReply(const InterviewStreamRequest& request) const;// 构建 corrective 风格的回复
    std::string buildGuidedReply(const InterviewStreamRequest& request) const;// 构建 guided 风格的回复
    std::string buildReferenceAnswerReply(const InterviewStreamRequest& request) const;// 构建直接揭示参考答案的回复
    std::string buildSourceContextBlock(const InterviewStreamRequest& request) const;// 构建包含来源上下文信息的文本块（如果有的话）

    std::vector<std::string> splitTextToChunks(const std::string& text) const;// 将文本按 m_chunkSize 切分成多个 chunk

    void emitChunk(std::function<void(const InterviewStreamEvent&)>& callback,
                   const std::string& content) const;// 触发一个 chunk 事件
    void emitDone(std::function<void(const InterviewStreamEvent&)>& callback) const;// 触发完成事件
    void emitError(std::function<void(const InterviewStreamEvent&)>& callback,
                   ApiErrorCode code, const std::string& message) const;// 触发错误事件
    void sleepMs(int ms) const;// 模拟处理延迟
};
