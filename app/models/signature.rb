class Signature < ActiveRecord::Base
  belongs_to :user
  belongs_to :agreement

  validates :user_id, presence: true
  validates :agreement_id, presence: true

  attr_accessible :user, :agreement
end
