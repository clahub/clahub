class Signature < ActiveRecord::Base
  belongs_to :user
  belongs_to :agreement

  validates :user_id, presence: true
  validates :agreement_id, presence: true

  attr_accessible :user, :agreement

  after_create :check_open_pulls_on_agreement

  private

  def check_open_pulls_on_agreement
    agreement.check_open_pulls
  end
end
