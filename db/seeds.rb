# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rake db:seed (or created alongside the db with db:setup).
#
# Examples:
#
#   cities = City.create([{ name: 'Chicago' }, { name: 'Copenhagen' }])
#   Mayor.create(name: 'Emanuel', city: cities.first)

[
  [ "Email",               true,  "string", nil ],
  [ "Name",                true,  "string", nil ],
  [ "Mailing address",     true,  "text",   nil ],
  [ "Country",             true,  "string", nil ],
  [ "Phone or Skype",      true,  "string", nil ],
  [ 'Type "I AGREE"',      true,  "agree",  "Please type the exact text I AGREE to indicate your agreement."],
  [ "Type your initials",  false, "string", nil ],
  [ "Corporate Contributor Information",  true, "text", "If you are employed as a software engineer, or if your employer is in the business of developing software, or otherwise may claim rights in the Contributions, please provide information about your employer's policy on contributing to open source projects, including the name of the supervisor to contact in connection with such contributions."]
].each do |label, enabled_by_default, data_type, description|
  Field.find_or_create_by_label_and_enabled_by_default_and_data_type_and_description(label, enabled_by_default, data_type, description)
end
