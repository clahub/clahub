class GithubWebhooksController < ApplicationController
  def repo_hook
    event = request.headers['X-GitHub-Event']

    Rails.logger.info(event.inspect)
    Rails.logger.info(params)

    if event == 'push'
      payload = GithubPush.new(params[:payload])
      PushStatusChecker.new(payload).check_and_update
    elsif event == 'pull_request'
      payload = GithubPullRequest.new(params[:payload])
      PullRequestStatusChecker.new(payload).check_and_update
    end

    render text: "OK", status: 200
  end
end
