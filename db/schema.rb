# encoding: UTF-8
# This file is auto-generated from the current state of the database. Instead
# of editing this file, please use the migrations feature of Active Record to
# incrementally modify your database, and then regenerate this schema definition.
#
# Note that this schema.rb definition is the authoritative source for your
# database schema. If you need to create the application database on another
# system, you should be using db:schema:load, not running all the migrations
# from scratch. The latter is a flawed and unsustainable approach (the more migrations
# you'll amass, the slower it'll run and the greater likelihood for issues).
#
# It's strongly recommended to check this file into your version control system.

ActiveRecord::Schema.define(:version => 20141106204040) do
  create_table "agreement_fields", :force => true do |t|
    t.integer  "agreement_id"
    t.integer  "field_id"
    t.datetime "created_at",                     :null => false
    t.datetime "updated_at",                     :null => false
    t.boolean  "enabled",      :default => true, :null => false
  end

  add_index "agreement_fields", ["agreement_id", "field_id"], :name => "index_agreement_fields_on_agreement_id_and_field_id"

  create_table "agreements", :force => true do |t|
    t.text     "text"
    t.integer  "user_id"
    t.datetime "created_at", :null => false
    t.datetime "updated_at", :null => false
    t.string   "name"
    t.string   "slug"
  end

  add_index "agreements", ["user_id"], :name => "index_licenses_on_user_id"

  create_table "announcements", :force => true do |t|
    t.text     "body"
    t.datetime "created_at", :null => false
    t.datetime "updated_at", :null => false
  end

  create_table "field_entries", :force => true do |t|
    t.integer "signature_id"
    t.integer "agreement_field_id"
    t.text    "value"
  end

  add_index "field_entries", ["signature_id", "agreement_field_id"], :name => "index_field_entries_on_signature_id_and_agreement_field_id"

  create_table "fields", :force => true do |t|
    t.string   "label"
    t.string   "data_type"
    t.datetime "created_at",                           :null => false
    t.datetime "updated_at",                           :null => false
    t.boolean  "enabled_by_default", :default => true, :null => false
    t.text     "description"
  end

  create_table "repositories", :force => true do |t|
    t.integer  "agreement_id"
    t.string   "user_name"
    t.string   "repo_name"
    t.integer  "github_repo_hook_id"
    t.datetime "created_at",          :null => false
    t.datetime "updated_at",          :null => false
  end

  create_table "signatures", :force => true do |t|
    t.integer  "user_id"
    t.integer  "agreement_id"
    t.datetime "created_at",                  :null => false
    t.datetime "updated_at",                  :null => false
    t.string   "ip",           :limit => nil
  end

  add_index "signatures", ["user_id", "agreement_id"], :name => "index_agreements_on_user_id_and_license_id"

  create_table "users", :force => true do |t|
    t.integer  "uid"
    t.string   "oauth_token"
    t.string   "nickname"
    t.string   "email"
    t.string   "name"
    t.datetime "created_at",  :null => false
    t.datetime "updated_at",  :null => false
  end

  add_index "users", ["uid"], :name => "index_users_on_uid"

end
