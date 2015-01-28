class AddOtherGithubRepoHookIdsToAgreements < ActiveRecord::Migration
  def change
    add_column :agreements, :other_github_repo_hook_ids, :string
  end
end
