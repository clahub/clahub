class MarkdownPreviewsController < ApplicationController
  protect_from_forgery :except => :create 

  def create
    source = params[:source]
    html = Kramdown::Document.new(source).to_html
    respond_to do |format|
      format.html { render text: html }
    end
  end
end
