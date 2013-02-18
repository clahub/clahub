class AgreementField < ActiveRecord::Base
  belongs_to :agreement
  belongs_to :field
  has_many :field_entries
  attr_accessible :field, :field_id, :enabled, :agreement
  validates :field_id, presence: true
  validates :agreement, presence: true

  def self.enabled
    where("enabled = TRUE")
  end
end
