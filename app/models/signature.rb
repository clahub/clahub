class Signature < ActiveRecord::Base
  belongs_to :user
  belongs_to :license

  validates :user_id, presence: true
  validates :license_id, presence: true

  attr_accessible :user, :license
end
