require 'spec_helper'

describe Signature do
  it { should belong_to :user }
  it { should belong_to :agreement }
  it { should have_many :field_entries }

  it { should validate_presence_of :user_id }
  it { should validate_presence_of :agreement_id }

  it { should allow_mass_assignment_of(:user) }
  it { should allow_mass_assignment_of(:agreement) }
  it { should allow_mass_assignment_of(:field_entries_attributes) }

  it "tells its agreement to re-check open pulls" do
    agreement = create(:agreement)
    repository = create(:repository, user_name: 'the_owner', repo_name: 'the_repo', agreement: agreement)
    repository.stub(:check_open_pulls).and_return(true)

    expect(repository.check_open_pulls).to be_truthy

    create(:signature, agreement: agreement)
  end

  it "build default field entries for enabled fields" do
    Field.create({ label: 'Email', enabled_by_default: true, data_type: 'string' })
    Field.create({ label: 'Name', enabled_by_default: true, data_type: 'string' })
    Field.create({ label: 'Favorite Ice Cream', enabled_by_default: false, data_type: 'string' })

    agreement = build(:agreement)
    agreement.build_default_fields
    agreement.save

    signature = build(:signature, agreement: agreement)
    signature.field_entries.length.should == 0
    signature.build_default_field_entries
    signature.field_entries.length.should == 2
  end

  it "validates that it has a field entry for each of its enabled agreement's fields" do
    email_field = Field.create({ label: 'Email', enabled_by_default: true, data_type: 'string' })
    hat_field = Field.create({ label: 'Favorite hat', enabled_by_default: false, data_type: 'string' })

    agreement = build(:agreement)
    email_agreement_field = agreement.agreement_fields.build({ agreement: agreement, enabled: true, field: email_field })
    hat_agreement_field = agreement.agreement_fields.build({ agreement: agreement, enabled: false, field: hat_field  })
    agreement.save

    signature = build(:signature, agreement: agreement)
    expect(signature).to_not be_valid
    signature.errors[:base].should == ["There was a problem with one or more fields entries."]

    signature.field_entries.build({ signature: signature, agreement_field: email_agreement_field, value: "a@b.com" })
    expect(signature).to be_valid
  end

  it "validates its field entries against its enabled agreement's field requirements" do
    agree_field = Field.create({ label: 'Type I AGREE', enabled_by_default: true, data_type: 'agree' })
    hat_field = Field.create({ label: 'Favorite hat', enabled_by_default: false, data_type: 'string' })

    agreement = build(:agreement)
    agree_agreement_field = agreement.agreement_fields.build({ agreement: agreement, enabled: true, field: agree_field })
    hat_agreement_field = agreement.agreement_fields.build({ agreement: agreement, enabled: false, field: hat_field  })
    agreement.save

    signature = build(:signature, agreement: agreement)
    signature.field_entries.build({ agreement_field: agree_agreement_field, value: "" })
    expect(signature).to_not be_valid

    signature.errors[:base].should == ["There was a problem with one or more fields entries."]

    signature.field_entries = []
    signature.field_entries.build({ agreement_field: agree_agreement_field, value: "I AGREE" })
    expect(signature).to be_valid
  end
end
