class AddLicensesGithubRepoHookId < ActiveRecord::Migration
  def up
    add_column :licenses, :github_repo_hook_id, :integer
  end

  def down
    remove_column :licenses, :github_repo_hook_id
  end
end
