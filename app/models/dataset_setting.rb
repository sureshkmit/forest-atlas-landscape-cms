class DatasetSetting < ApplicationRecord
  belongs_to :context
  belongs_to :page

  validates_presence_of :dataset_id
  before_save :update_timestamp

  def get_fields
    DatasetService.get_fields self.dataset_id
  end

  def get_filtered_dataset
    if self.filters.blank?
      return DatasetService.get_dataset self.dataset_id
    else
      query = 'select '
      if self.columns_visible
        query += (JSON.parse self.columns_visible).join(', ')
      else
        query += '*'
      end
      query += " from #{self.api_table_name} "
      query += 'where ' + (JSON.parse self.filters).join(' AND ') if self.filters.length > 0
      query += ' limit 10000'
      return DatasetService.get_filtered_dataset self.dataset_id, query
    end
  end

  private
  def update_timestamp
    self.fields_last_modified = {
      columns_changeable: self.columns_chageable,
      columns_visible: self.columns_visible,
      filters: self.filters}.hash
  end
end
