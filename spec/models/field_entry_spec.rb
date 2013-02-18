require 'spec_helper'

describe FieldEntry do
  it { should belong_to :agreement_field }
  it { should belong_to :signature }
  it { should allow_mass_assignment_of :agreement_field_id }
  it { should allow_mass_assignment_of :agreement_field }
  it { should allow_mass_assignment_of :signature }
  it { should allow_mass_assignment_of :value }

  it "validates string fields" do
    field_entry = build_blank_field_entry('Name', 'string')
    field_entry.valid?
    field_entry.errors[:value].should == ["can't be blank"]
  end

  it "validates text fields" do
    field_entry = build_blank_field_entry('Company FOSS policy', 'text')
    field_entry.valid?
    field_entry.errors[:value].should == ["can't be blank"]
  end


  it "validates agree fields" do
    field_entry = build_blank_field_entry('Please type: I AGREE', 'agree')
    field_entry.valid?
    field_entry.errors[:value].should == ["must be exactly I AGREE"]
  end

  def build_blank_field_entry(label, data_type)
    field = Field.create({ label: label, enabled_by_default: true, data_type: data_type })

    agreement = build(:agreement)
    agreement_field = agreement.agreement_fields.build({ enabled: true, field: field })
    agreement.save

    signature = build(:signature, agreement: agreement)

    field_entry = signature.field_entries.build({ agreement_field: agreement_field, value: nil })
  end
end
