module ApplicationHelper
  def owner_slash_name(repo)
    "#{repo.owner.login}/#{repo.name}"
  end
end
