FactoryGirl.define do
  factory :signature do
    association :user
    association :license
  end
end
