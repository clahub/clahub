class License < ActiveRecord::Base
  belongs_to :user

  validates :repo_name, presence: true
  validates :user_name, presence: true
  validates :text, presence: true

  attr_accessible :repo_name, :text

  before_validation :set_user_name_from_user_nickname

  private

  def set_user_name_from_user_nickname
    self.user_name = user.try(:nickname)
  end
end
