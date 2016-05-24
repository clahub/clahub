class GithubWebhooksController < ApplicationController
  def repo_hook
    event = request.headers['X-GitHub-Event']
    Rails.logger.info(event.inspect)

    CommitCheckWorker.perform_async(event, params)

    render text: "OK", status: 200
  end
end
