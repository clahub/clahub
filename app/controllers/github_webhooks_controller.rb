class GithubWebhooksController < ApplicationController
  def repo_hook
    event = request.headers['X-GitHub-Event']
    payload = JSON.parse(params[:payload] || '{}', :object_class => Hashie::Mash)

    Rails.logger.info(event.inspect)
    Rails.logger.info(params)


    if event == 'push'
      commit_group = CommitGroup.new(
        payload.repository.owner.name, payload.repository.name)
      commit_group.set_from_payload(payload)
    elsif event == 'pull_request'
      commit_group = CommitGroup.new(
        payload.repository.owner.login, payload.repository.name)
      commit_group.fetch_from_pull_request(payload.pull_request.number)
    end

    unless commit_group.nil?
      commit_group.check_and_update
    end

    render text: "OK", status: 200
  end
end
