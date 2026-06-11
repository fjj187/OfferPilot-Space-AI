#pragma once
#include "../include/DTO/Common DTO.hpp"
#include <string>
#include <vector>

// 会话列表中的单项
struct InterviewSessionListItemDto {
    std::string sessionId;               // 会话ID
    std::string threadId;                // 线程ID
    std::string topic;                   // 面试话题
    std::string questionTitle;           // 面试问题标题
    std::string feedbackStyle;           // 反馈风格 (可选)
    int messageCount = 0;                // 消息总数
    std::string latestUserMessage;       // 最新用户消息 (可选)
    std::string latestAssistantMessage;  // 最新助手消息 (可选)
    std::string updatedAt;               // 更新时间, ISO 8601
};

// 会话列表响应
struct ListInterviewSessionsResponseDto {
    std::vector<InterviewSessionListItemDto> sessions;
};

// 会话详情 (继承列表项字段, 并增加消息列表)
struct InterviewSessionDetailDto : public InterviewSessionListItemDto {
    std::vector<MessageDto> messages;    // 会话全部消息
};

// 会话详情响应
struct GetInterviewSessionDetailResponseDto {
    InterviewSessionDetailDto session;
};

// 清空历史响应
struct ClearInterviewHistoryResponseDto {
    bool ok = false;                     // 是否成功
};