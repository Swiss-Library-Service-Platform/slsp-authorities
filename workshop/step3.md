# Step 3: Build Something

Now it's time to experiment. There are two options:

## Option 1: Build Your Own Idea

If you have a specific use case or idea in mind, go for it. This is a good opportunity to discuss with others, ask questions, and explore what's possible.

Some ideas to get you started:
- Prototype something relevant to your institution's workflows
- Build a dashboard widget for daily tasks (e.g., monitoring queues, quick stats, ...)
- Experiment with integrating external APIs or services

## Option 2: Extend the Starter App

If you'd like to get more familiar with the framework first, try the following:

### 1. Switch Entity Types

The starter app currently lists all entities visible in Alma's main UI. Try filtering for a specific entity type, such as bibliographic items only.

Check the SDK's [EntityType](https://github.com/ExLibrisGroup/cloudapp-sdk/blob/master/angular-lib/src/lib/public-interfaces.ts) interface to see what's available.

### 2. Display Entity Details

Right now, [entity-detail.component.html](../starter-app/cloudapp/src/app/entity-detail/entity-detail.component.html) just dumps the entire JSON. Try displaying specific fields instead: title, author, call number, or whatever makes sense for your entity type.

You can access fields directly in the template (e.g., `entity()?.title` or `entity()?.author`).

If you want cleaner, type-safe code, you can create a TypeScript interface for your data. Create a new file in `cloudapp/src/app/models/` (e.g., `bib-entity.model.ts`) with an interface that defines the fields you need. Then use the RxJS `map()` operator in the entities observable pipeline to transform the raw entities into your model. You'll also need to update the component types accordingly.

For reference on how to do this, you can also check out existing cloud apps, such as the [Bib Hierarchy Cloud App](https://github.com/HSG-Library/alma-bib-hierarchy)

### 3. Fetch Additional Data

Use the Alma REST API to retrieve related information for your entities using the `CloudAppRestService` and show it in the detail view. Some suggestions:

**For bibliographic records:** Fetch holdings using `/almaws/v1/bibs/{mms_id}/holdings` or loans using `/almaws/v1/bibs/{mms_id}/loans`

**For users:** Fetch loans or fines

Check the [Alma REST API documentation](https://developers.exlibrisgroup.com/alma/apis/) to see what endpoints are available for your entity type.

## Resources

- [Cloud App SDK Reference](https://developers.exlibrisgroup.com/cloudapps/docs/)
- [Alma REST APIs](https://developers.exlibrisgroup.com/alma/apis/)
