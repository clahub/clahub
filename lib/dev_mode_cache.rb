# Quick and dirty cache that speeds up development of pages with external HTTP dependencies
module DevModeCache
  def self.cache(key, &block)
    if Rails.env.development?
      $__cache_in_development_storage ||= {}
      $__cache_in_development_storage[key] ||= block.call
    else
      block.call
    end
  end
end
