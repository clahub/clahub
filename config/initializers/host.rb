HOST = ENV['HOST'] || {
  'development' => 'http://localhost:3000',
  'test'        => 'http://example.com',
  'production'  => 'http://thg-clahub.herokuapp.com'
}[Rails.env]
