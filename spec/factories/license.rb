FactoryGirl.define do
  factory :license do
    association :user
    sequence(:repo_name) { |n| "repo_name#{n}" }
    text "Generic CLA text"

    after(:build) do |l|
      l.user_name = l.user.nickname
    end
  end
end
