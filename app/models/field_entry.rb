class FieldEntry < ActiveRecord::Base
  belongs_to :agreement_field
  belongs_to :signature
  attr_accessible :agreement_field_id, :agreement_field, :signature, :value

  validate :valid_value

  private

  def valid_value
    return false unless agreement_field && agreement_field.field

    case agreement_field.field.data_type
    when 'text', 'string'
      validate_value_with ActiveModel::Validations::PresenceValidator
    when 'agree'
      validate_value_with ActiveModel::Validations::AcceptanceValidator, :accept => "I AGREE", allow_nil: false, message: "must be exactly I AGREE"
    else
      raise "Don't know how to validate FieldEntry for field type #{agreement_field.field.data_type}"
    end
  end

  def validate_value_with(validator_class, options = {})
    validator_class.new(options.merge(attributes: [:value])).validate(self)
  end
end
