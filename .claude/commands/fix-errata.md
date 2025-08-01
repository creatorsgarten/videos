Please fix the captions. When given a path to a video caption file (e.g., data/videos/bkkjs23/lmwn_th.vtt), you will:

1. **Parse the file path** to extract:

   - Event identifier (e.g., 'bkkjs23')
   - Video slug (e.g., 'lmwn')
   - Language code from filename (e.g., 'th' from '\_th.vtt')

2. **Fetch errata data** from the URL pattern:

   - https://creatorsgarten-video-captions-review.spacet.me/errata/{event}/{slug}/{language}
   - Handle cases where errata data may not exist (404 responses)
   - Parse the errata format and understand correction instructions
   - **CRITICAL**: Create two separate todo phases after fetching errata data:
     1. **Fixing Phase**: Add todos for each text correction (e.g., "Apply correction: 'kleros' → 'Kyo Roll Up'")
     2. **Verification Phase**: Add todos for each timestamp to verify comprehensive coverage

3. **Apply corrections**:

   - Read the original VTT caption file
   - Apply text corrections and formatting fixes as specified in errata
   - Use timestamps from errata to locate precise lines, but search for ALL instances of each correction
   - Do not touch the timestamps
   - Make sure there is proper spacing between Thai and non-Thai text
   - Maintain proper VTT format structure and timing

4. **Update associated metadata**:

   - Locate and read the corresponding .md file (e.g., data/videos/bkkjs23/lmwn.md)
   - **IMPORTANT**: Check both chapter titles AND description text for terms that need correction
   - Update metadata to maintain consistency with corrected captions
   - Preserve frontmatter structure and other metadata fields
   - Apply the same corrections from the VTT file to any matching terms in metadata

5. **Quality assurance**:

   - **Timestamp Verification**: Check each timestamp from errata to ensure the correction was applied at that location
   - Verify that corrections don't introduce new formatting issues
   - Check that metadata updates align with caption changes

6. **Error handling**:

   - Gracefully handle missing errata data
   - Provide clear feedback about what corrections were applied
   - Report any conflicts or issues that require manual review
   - Maintain backups of original content when making significant changes

You will work methodically through each correction, explaining what changes are being made and why. If errata data contains ambiguous instructions, you will seek clarification before proceeding. Your goal is to improve caption accuracy while maintaining the technical integrity of the VTT format and associated metadata consistency.

## Process Best Practices

- **Two-Phase Todo Structure**: 
  - **Phase 1**: Create todos for each text correction (use timestamps to locate but fix ALL instances)
  - **Phase 2**: Create todos for each timestamp to verify comprehensive coverage
- **Systematic TodoWrite Usage**: Create specific todos like "Apply correction: 'kleros' → 'Kyo Roll Up'" rather than generic "apply corrections"
- **Cross-file Impact**: Remember that technical terms in VTT files often appear in metadata files too
- **Timestamp-Guided Fixing**: Use errata timestamps to locate lines quickly, but search globally for all instances of each correction
- **Verification by Timestamp**: After fixing, check each errata timestamp to confirm the correction was applied at that specific location
- **User Feedback = Missed Todo**: If user questions missing corrections, check your original todo list - you likely didn't capture all errata items initially
