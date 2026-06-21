#include "providers/MockInterviewProviders.hpp"

MockInterviewProvider::MockInterviewProvider()
    : m_chunkSize(15),
      m_chunkDelayMs(500),
      m_referenceRevealThreshold(3),
      m_defaultProviderName("MockProvider") 
{
}

void MockInterviewProvider::streamFeedback(const InterviewStreamRequest& request,
std::function<void(const InterviewStreamEvent&)> callback,std::shared_ptr<ProviderContext> context) 
{
    if(!validateRequest(request)){
        emitError(callback, ApiErrorCode::InvalidRequest, "Invalid request: missing required fields");
        return;
    }//验证请求的必填字段是否齐全
    if(shouldCancel(context)){
        emitError(callback, ApiErrorCode::ProviderError, "Request cancelled");
        return;
    }//检查是否已被取消
    std::string replyText = buildReplyText(request);//根据请求构建回复文本
    std::vector<std::string> chunks = splitTextToChunks(replyText);//将回复文本切分成多个 chunk
    for(const auto& chunk : chunks){
        if(shouldCancel(context)){
            return;
        }
        emitChunk(callback, chunk);// 触发 chunk 事件
        sleepMs(m_chunkDelayMs);// 模拟处理延迟
    }
    emitDone(callback);// 全部 chunk 发送完毕，触发完成事件
}

bool MockInterviewProvider::validateRequest(const InterviewStreamRequest& request) const {
    return !(request.sessionId.empty() || request.messageId.empty() || request.threadId.empty() ||
             request.topic.empty() || request.questionTitle.empty() || request.questionPrompt.empty()
            || request.answer.empty()||request.prompt.empty()||request.topicLabel.empty());
}

bool MockInterviewProvider::shouldCancel(std::shared_ptr<ProviderContext> context) const {
    if(context==nullptr){
        return false;
    }
    if(context->cancelFlag){
        return true;
    }
    return false;
}

bool MockInterviewProvider::shouldRevealReferenceAnswer(const InterviewStreamRequest& request) const {
    if(request.options.forceRevealReferenceAnswer){
        return true;
    }
    if(request.options.unknownAnswerStreak.has_value() &&
       request.options.unknownAnswerStreak.value() >= m_referenceRevealThreshold){
        return true;
    }
    return false;
}

std::string MockInterviewProvider::buildReplyText(const InterviewStreamRequest& request) const {
    if (shouldRevealReferenceAnswer(request)) {
        return buildReferenceAnswerReply(request);
    }
    if(request.options.feedbackStyle.has_value()){
        switch (request.options.feedbackStyle.value()){
            case InterviewFeedbackStyle::Followup:
                return buildFollowupReply(request);
            case InterviewFeedbackStyle::Corrective:
                return buildCorrectiveReply(request);
            case InterviewFeedbackStyle::Guided:
                return buildGuidedReply(request);
            default:
                break;
        }
    }
    return buildGuidedReply(request);// 默认使用 guided 风格
}

std::string MockInterviewProvider::buildFollowupReply(const InterviewStreamRequest& request) const {
    std::ostringstream oss;
    oss << "你刚才的回答方向是对的，但我想继续追问两个点。\n\n";
    oss << "第 1 个问题：关于「" << request.topicLabel << "」中的关键概念，你能不能用更具体的例子再解释一下？\n\n";
    oss << "第 2 个问题：这个场景下，如果条件发生了变化（比如环境不同），你的思路还能成立吗？\n\n";
    oss << "请先回答这两个问题，我们再继续下一题。";
    return oss.str();
}

std::string MockInterviewProvider::buildCorrectiveReply(const InterviewStreamRequest& request) const {
    std::ostringstream oss;
    oss << "你这段回答的主要问题是：没有完全抓住「" << request.questionTitle << "」的核心。\n\n";
    oss << "更准确的表达应该是先把原理讲清楚，再结合场景拆解关键步骤。\n\n";
    oss << buildSourceContextBlock(request);  // 附上资料相关信息
    oss << "\n下一步建议：\n";
    oss << "1. 重新明确问题目标\n";
    oss << "2. 用第一步、第二步的结构重新回答\n";
    oss << "3. 检查是否遗漏了重要约束条件\n";
    return oss.str();
}

std::string MockInterviewProvider::buildGuidedReply(const InterviewStreamRequest& request) const {
    std::ostringstream oss;
    oss << "针对「" << request.questionTitle << "」，你可以试试按这个思路回答：\n\n";
    oss << "第一层：先说出核心概念是什么。\n";
    oss << "第二层：拆成 2～3 个关键步骤，分别解释。\n";
    oss << "第三层：最后补一个你自己经历过的例子，或者模拟一个场景。\n\n";
    oss << "你现在可以按这个顺序再试一次。";
    return oss.str();
}

std::string MockInterviewProvider::buildReferenceAnswerReply(const InterviewStreamRequest& request) const {
    std::ostringstream oss;
    oss << "参考要点：\n";
    oss << "- 核心概念：和「" << request.topicLabel << "」密切相关的定义\n";
    oss << "- 关键步骤：先分析输入，再选择处理方法，最后校验输出\n";
    if (!request.options.referenceAnswerHint.has_value() || request.options.referenceAnswerHint.value().empty()) {
        oss << "- 常见误区：忽略边界条件\n";
    } else {
        oss << "- " << request.options.referenceAnswerHint.value() << "\n";
    }
    oss << "\n简要说明：上面是一个标准参考框架，不必完全照背，但结构要清晰。\n";
    oss << "如果你已经理解了，可以继续下一题。";
    return oss.str();
}

std::string MockInterviewProvider::buildSourceContextBlock(const InterviewStreamRequest& request) const {
    std::ostringstream oss;
    if (request.sourceContext.has_value() && !request.sourceContext.value().empty()) {
        oss << "参考上下文：\n" << request.sourceContext.value() << "\n";
    }
    if (request.sourceDocumentName.has_value() && !request.sourceDocumentName.value().empty()) {
        oss << "相关文档：《" << request.sourceDocumentName.value() << "》\n";
    }
    if (request.sourceDocumentSummary.has_value() && !request.sourceDocumentSummary.value().empty()) {
        oss << "文档摘要：" << request.sourceDocumentSummary.value() << "\n";
    }
    if (request.sourceDocumentTags.has_value() && !request.sourceDocumentTags.value().empty()) {
        oss << "标签：";
        for (size_t i = 0; i < request.sourceDocumentTags.value().size(); ++i) {
            if (i > 0) oss << ", ";
            oss << request.sourceDocumentTags.value()[i];
        }
        oss << "\n";
    }
    return oss.str();
}

std::vector<std::string> MockInterviewProvider::splitTextToChunks(const std::string& text) const {
    std::vector<std::string> chunks;
    if(m_chunkSize <= 0){
        return chunks;
    }
    for (size_t i = 0; i < text.size(); i += m_chunkSize) {
        chunks.push_back(text.substr(i, m_chunkSize));
    }
    return chunks;
}

void MockInterviewProvider::emitChunk(std::function<void(const InterviewStreamEvent&)>& callback,
const std::string& content) const {
    InterviewStreamEvent event;
    event.type = InterviewStreamEventType::Chunk;
    event.content = content;
    callback(event);
}

void MockInterviewProvider::emitDone(std::function<void(const InterviewStreamEvent&)>& callback) const {
    InterviewStreamEvent event;
    event.type = InterviewStreamEventType::Done;
    callback(event);
}

void MockInterviewProvider::emitError(std::function<void(const InterviewStreamEvent&)>& callback,
ApiErrorCode code, const std::string& message) const {      
    InterviewStreamEvent event;
    event.type = InterviewStreamEventType::Error;
    event.error = ApiError{code, message};
    callback(event);
}

void MockInterviewProvider::sleepMs(int ms) const {
    std::this_thread::sleep_for(std::chrono::milliseconds(ms));
}
