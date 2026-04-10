import { DataField, SubField } from '../models/bib-record.model';

export class SubfieldSixLinkUtils {
  /**
   * Scan all dataFields for $$6 values, extract the link number, return the highest.
   * e.g. fields with $$6 "880-01", "880-03", "700-02/(B" → returns 3
   */
  public static getHighestLinkNumber(dataFields: DataField[]): number {
    let max = 0;

    for (const field of dataFields) {
      for (const sf of field.subfields) {
        if (sf.code === '6') {
          const parsed = SubfieldSixLinkUtils.parseSubfield6(sf.value);

          if (parsed && parsed.linkNumber > max) {
            max = parsed.linkNumber;
          }
        }
      }
    }

    return max;
  }

  /**
   * Format a link number as zero-padded 2-digit string: 4 → "04"
   */
  public static formatLinkNumber(num: number): string {
    return num.toString().padStart(2, '0');
  }

  /**
   * Generate $$6 value for the original field: "880-04"
   */
  public static buildOriginalSubfield6(linkNumber: number): string {
    return `880-${SubfieldSixLinkUtils.formatLinkNumber(linkNumber)}`;
  }

  /**
   * Generate $$6 value for the 880 field: "700-04/(B"
   * Script code is always (B (Latin) for IdRef.
   */
  public static buildField880Subfield6(originalTag: string, linkNumber: number): string {
    return `${originalTag}-${SubfieldSixLinkUtils.formatLinkNumber(linkNumber)}/(B`;
  }

  /**
   * Check whether a field already has a $$6 subfield.
   */
  public static hasSubfield6(field: DataField): boolean {
    return field.subfields.some((sf) => sf.code === '6');
  }

  /**
   * Extract the link number from an existing $$6 subfield, or null if none exists.
   * e.g. field with $$6 "880-02" → 2, field with $$6 "700-04/(B" → 4
   */
  public static getExistingLinkNumber(field: DataField): number | null {
    const sf6 = field.subfields.find((sf) => sf.code === '6');

    if (!sf6) {
      return null;
    }

    const parsed = SubfieldSixLinkUtils.parseSubfield6(sf6.value);

    return parsed ? parsed.linkNumber : null;
  }

  /**
   * Add $$6 to a field's subfields at position 0 (MARC convention: $$6 comes first).
   * Returns a new subfields array (does not mutate the original).
   */
  public static prependSubfield6(subfields: SubField[], value: string): SubField[] {
    return [{ code: '6', value }, ...subfields];
  }

  /**
   * Remove $$6 subfield(s) from a field's subfields.
   * If linkNumber is provided, only removes the $$6 matching that specific link.
   * If no linkNumber, removes all $$6 (backward-compatible).
   * Returns a new subfields array (does not mutate the original).
   */
  public static removeSubfield6(subfields: SubField[], linkNumber?: number): SubField[] {
    if (linkNumber === undefined) {
      return subfields.filter((sf) => sf.code !== '6');
    }

    return subfields.filter((sf) => {
      if (sf.code !== '6') {
        return true;
      }

      const parsed = SubfieldSixLinkUtils.parseSubfield6(sf.value);

      if (parsed === null) {
        return true;
      }

      return parsed.linkNumber !== linkNumber;
    });
  }

  /**
   * Parse a $$6 value to extract the tag and link number.
   * "880-04" → { tag: '880', linkNumber: 4 }
   * "700-02/(B" → { tag: '700', linkNumber: 2 }
   * Returns null if not parseable.
   */
  public static parseSubfield6(value: string): { tag: string; linkNumber: number } | null {
    const match = value.match(/^(\d{3})-(\d{2})/);

    if (!match) {
      return null;
    }

    return { tag: match[1], linkNumber: parseInt(match[2], 10) };
  }

  /**
   * Find all 880 fields linked to a given original field (by matching $$6 link numbers).
   * The originalField must have $$6 like "880-XX".
   * Returns all 880 dataFields whose $$6 matches "TAG-XX/..." with the same link number.
   */
  public static findLinked880Fields(
    originalField: DataField,
    allDataFields: DataField[]
  ): DataField[] {
    const sf6 = originalField.subfields.find((sf) => sf.code === '6');

    if (!sf6) {
      return [];
    }

    const parsed = SubfieldSixLinkUtils.parseSubfield6(sf6.value);

    if (!parsed || parsed.tag !== '880') {
      return [];
    }

    const linkNum = parsed.linkNumber;

    return allDataFields.filter((f) => {
      if (f.tag !== '880') {
        return false;
      }

      const f6 = f.subfields.find((sf) => sf.code === '6');

      if (!f6) {
        return false;
      }

      const fParsed = SubfieldSixLinkUtils.parseSubfield6(f6.value);

      return fParsed !== null && fParsed.linkNumber === linkNum;
    });
  }

  /**
   * Find the original field linked to a given 880 field.
   * The 880 field has $$6 like "700-XX/(B".
   * Returns the dataField with the matching tag that has $$6 "880-XX" with the same link number.
   */
  public static findLinkedOriginalField(
    field880: DataField,
    allDataFields: DataField[]
  ): DataField | null {
    const sf6 = field880.subfields.find((sf) => sf.code === '6');

    if (!sf6) {
      return null;
    }

    const parsed = SubfieldSixLinkUtils.parseSubfield6(sf6.value);

    if (!parsed) {
      return null;
    }

    const expectedTag = parsed.tag;
    const linkNum = parsed.linkNumber;

    return (
      allDataFields.find((f) => {
        if (f.tag !== expectedTag) {
          return false;
        }

        const f6 = f.subfields.find((sf) => sf.code === '6');

        if (!f6) {
          return false;
        }

        const fParsed = SubfieldSixLinkUtils.parseSubfield6(f6.value);

        return fParsed !== null && fParsed.tag === '880' && fParsed.linkNumber === linkNum;
      }) ?? null
    );
  }
}
