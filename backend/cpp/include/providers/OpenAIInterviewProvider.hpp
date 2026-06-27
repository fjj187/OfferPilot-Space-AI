#pragma once
#include "InterviewProvider.hpp"

class OpenAIInterviewProvider : public InterviewProvider {
public:
    OpenAIInterviewProvider(/* api key, model, timeout 等 */);

    void streamFeedback(const InterviewStreamRequest& request,
                        std::function<void(const InterviewStreamEvent&)> callback,
                        std::shared_ptr<ProviderContext> context = nullptr) override;

private:
    // api key / base url / model / timeout
};