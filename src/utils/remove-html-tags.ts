export function removeHtmlTags(inputString: string) {
    // Define the regular expression pattern
    const htmlTagsRegex = /<[^>]*>/g;

    // Use the regular expression to remove HTML tags
    const stringWithoutHtml = inputString.replace(htmlTagsRegex, "");
    return stringWithoutHtml;
}