require 'spec_helper'

describe Signature do
  it { should belong_to :user }
  it { should belong_to :license }

  it { should validate_presence_of :user_id }
  it { should validate_presence_of :license_id }

  it { should allow_mass_assignment_of(:user) }
  it { should allow_mass_assignment_of(:license) }
end
