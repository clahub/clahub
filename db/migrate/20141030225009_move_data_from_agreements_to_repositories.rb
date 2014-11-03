class MoveDataFromAgreementsToRepositories < ActiveRecord::Migration
  def up
    Agreement.all.each do |a|
      Repository.create(agreement_id: a.id, user_name: a.user_name, repo_name: a.repo_name, github_repo_hook_id: a.github_repo_hook_id)
    end
    
    remove_columns :agreements, :user_name, :repo_name, :github_repo_hook_id
  end
  
  def down
    add_column :agreements, :user_name, :string
    add_column :agreements, :repo_name, :string
    add_column :agreements, :github_repo_hook_id, :integer
    
    add_index :agreements, [:user_name, :repo_name]
    
    Agreement.reset_column_information
    
    Agreement.all.each do |a|
      a.repositories.each do |r|
        a.user_name = r.user_name
        a.repo_name = r.repo_name
        a.github_repo_hook_id = r.github_repo_hook_id
      end
      a.save
    end
  end
end
