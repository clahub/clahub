require 'csv'

class AgreementCsvPresenter
  def initialize(agreement)
    @agreement = agreement
  end

  def to_csv
    CSV.generate do |csv|
      csv << ["Name", "GitHub username", "Signature time"]
      @agreement.signatures.each do |signature|
        csv << [signature.user.name, signature.user.nickname, signature.created_at]
      end
    end
  end
end
