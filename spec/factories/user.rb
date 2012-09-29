FactoryGirl.define do
  factory :user do
    sequence(:uid)
    sequence(:oauth_token) { |n| "oauth-token-#{n}" }
    sequence(:nickname)    { |n| "nickname#{n}" }
    sequence(:email)       { |n| "email#{n}@example.com" }
    sequence(:name)        { |n| "Firstname Lastname #{n}" }
  end
end
