require 'csv'

class AgreementCsvPresenter
  def initialize(agreement)
    @agreement = agreement
  end

  def to_csv
    agreement_fields = @agreement.enabled_agreement_fields.sort_by(&:ordering)

    CSV.generate do |csv|
      csv << ["GitHub Profile name", "GitHub username", "Signature time", *agreement_fields.map(&:field).map(&:label)]
      @agreement.signatures.each do |signature|
        field_entries = signature.field_entries.sort_by(&:ordering)

        csv << [signature.user.name, signature.user.nickname, signature.created_at, *field_entries.map(&:value)]
      end
    end
  end
end
