FactoryGirl.define do
  factory :signature do
    association :user
    association :agreement
  end
end
