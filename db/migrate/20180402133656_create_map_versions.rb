class CreateMapVersions < ActiveRecord::Migration[5.0]
  def change
    create_table :map_versions do |t|
      t.string :version, null: false, unique: true
      t.integer :position
      t.string :description

      t.index :version
      t.timestamps
    end

    a = MapVersion.new(version: '1.1.11', position: 1)
    a.save(validate: false)
    a = MapVersion.new(version: '1.1.12', position: 2)
    a.save(validate: false)
    a = MapVersion.new(version: '1.1.15', position: 3)
    a.save(validate: false)

  end
end
