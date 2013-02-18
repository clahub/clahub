class Signature < ActiveRecord::Base
  belongs_to :user
  belongs_to :agreement
  has_many :field_entries, inverse_of: :signature

  attr_accessible :user, :agreement, :field_entries_attributes
  accepts_nested_attributes_for :field_entries

  validates :user_id, presence: true
  validates :agreement_id, presence: true
  validate :agreement_fields_are_satisfied

  after_create :check_open_pulls_on_agreement

  def build_default_field_entries
    self.field_entries = []
    agreement.enabled_agreement_fields.each do |agreement_field|
      self.field_entries.build({
        signature: self,
        agreement_field: agreement_field
      })
    end
  end

  private

  def agreement_fields_are_satisfied
    return if agreement.nil?

    agreement.enabled_agreement_fields.each do |agreement_field|
      field_entry = field_entries.detect { |fe| fe.agreement_field == agreement_field }

      if field_entry.blank? || ! field_entry.valid?
        errors[:base] << "There was a problem with one or more fields entries."
      end
    end
  end

  def check_open_pulls_on_agreement
    agreement.check_open_pulls
  end
end
