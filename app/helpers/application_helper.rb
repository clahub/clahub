module ApplicationHelper
  def owner_slash_name(repo)
    "#{repo.owner.login}/#{repo.name}"
  end

  def body_class
    qualified_controller_name = controller.controller_path.gsub('/','-')
    "#{qualified_controller_name} #{qualified_controller_name}-#{controller.action_name}"
  end
end
