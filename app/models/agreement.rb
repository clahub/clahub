class Agreement < ActiveRecord::Base
  belongs_to :user
  has_many :signatures
  has_many :signing_users, through: :signatures, source: :user
  has_many :agreement_fields, inverse_of: :agreement
  has_many :fields, through: :agreement_fields
  has_many :repositories

  attr_accessible :text, :agreement_fields_attributes, :github_repositories, :repositories
  attr_accessor :github_repositories
  
  before_validation :remove_blanks_from_github_repositories, if: "!github_repositories.blank?"
  
  validates :text, presence: true
  # validates :github_repositories, presence: true
  # validate :one_agreement_per_user_repo
  validate :has_repositories_selected
  validate :repositories_not_already_in_a_agreement, if: "!github_repositories.blank?"

  accepts_nested_attributes_for :agreement_fields, :repositories

  def owned_by?(candidate)
    candidate == self.user
  end

  def signed_by?(candidate)
    signing_users.include?(candidate)
  end

  def build_default_fields
    self.agreement_fields = []
    Field.all.each do |field|
      self.agreement_fields.build({
        agreement: self,
        field: field,
        enabled: field.enabled_by_default
      })
    end
  end

  def enabled_agreement_fields
    agreement_fields.enabled
  end
  
  def repositories_with_user_repo
    repositories.collect{ |r| "#{r.user_name}/#{r.repo_name}" }
  end
  
  def repository_names_for_csv
    repositories_with_user_repo.join('-').gsub(/\//, '-')
  end

  private
  
  def remove_blanks_from_github_repositories
    self.github_repositories = github_repositories.delete_if{|r| r.blank?}
  end
  
  def has_repositories_selected
    if !github_repositories.present?
      errors.add(:github_repositories, "You have to select at least one repository from the list")
    end
  end
  
  def repositories_not_already_in_a_agreement
    sql = []
    selected_repositories = github_repositories.collect{|r| r.split('/')}
    selected_repositories.each do |r|
      sql << ActiveRecord::Base.send(:sanitize_sql_for_assignment, ["(user_name='%s' and repo_name='%s')", r.first, r.last])
    end
    sql = "SELECT * from repositories WHERE #{sql.join(' OR ')}"
    # Rails::logger.info("=============== #{sql}")
    selected_repositories = Repository.find_by_sql(sql)
    if selected_repositories.present?
      errors.add(:github_repositories, "you selected are (one or all) already part of a CLA")
    end
  end
  
  # 
  # def one_agreement_per_user_repo
  #   existing = Agreement.find_by_user_name_and_repo_name(user_name, repo_name)
  #   if existing && (existing != self)
  #     errors[:base] << "An agreement already exists for #{user_name}/#{repo_name}"
  #   end
  # end
end
