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

ActiveRecord::Schema.define(:version => 20121006080717) do

  create_table "licenses", :force => true do |t|
    t.string   "user_name"
    t.string   "repo_name"
    t.text     "text"
    t.integer  "user_id"
    t.datetime "created_at",          :null => false
    t.datetime "updated_at",          :null => false
    t.integer  "github_repo_hook_id"
  end

  add_index "licenses", ["user_id"], :name => "index_licenses_on_user_id"
  add_index "licenses", ["user_name", "repo_name"], :name => "index_licenses_on_user_name_and_repo_name"

  create_table "signatures", :force => true do |t|
    t.integer  "user_id"
    t.integer  "license_id"
    t.datetime "created_at", :null => false
    t.datetime "updated_at", :null => false
  end

  add_index "signatures", ["user_id", "license_id"], :name => "index_agreements_on_user_id_and_license_id"

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
