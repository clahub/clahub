# This file should contain all the record creation needed to seed the database with its default values.
# The data can then be loaded with the rake db:seed (or created alongside the db with db:setup).
#
# Examples:
#
#   cities = City.create([{ name: 'Chicago' }, { name: 'Copenhagen' }])
#   Mayor.create(name: 'Emanuel', city: cities.first)

[
  [ "Email",               true,  "string" ],
  [ "Name",                true,  "string" ],
  [ "Mailing address",     true,  "text"   ],
  [ "Country",             true,  "string" ],
  [ "Phone or Skype",      true,  "string" ],
  [ 'Type "I AGREE"',      true,  "agree"  ],
  [ "Type your initials",  false, "string" ]
].each do |label, enabled_by_default, data_type|
  Field.find_or_create_by_label_and_enabled_by_default_and_data_type(label, enabled_by_default, data_type)
end
