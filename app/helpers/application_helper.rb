module ApplicationHelper
  def owner_slash_name(repo)
    "#{repo.owner.login}/#{repo.name}"
  end

  def body_class
    qualified_controller_name = controller.controller_path.gsub('/','-')
    "#{qualified_controller_name} #{qualified_controller_name}-#{controller.action_name}"
  end

  def nav_link_to(content, path_or_options)
    li_options =
      if current_page?(path_or_options)
        { class: 'active' }
      else
        { }
      end

    content_tag('li', li_options) do
      link_to(content, path_or_options)
    end
  end
end
