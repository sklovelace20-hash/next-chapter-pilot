# Next Chapter on Cloudflare Workers

Deploy this package through GitHub and Cloudflare. The repository already contains the browser app and the Worker. Cloudflare runs the deployment command on its own build machines.

## 1. Put the files in GitHub

1. Unzip the download.
2. Create a private GitHub repository, for example `next-chapter`.
3. Use **Add file → Upload files**. Upload the contents of the extracted `next-chapter` folder, including the `dist` and `worker` folders. The repository root should show `wrangler.jsonc`, `dist/`, and `worker/`.
4. Commit the upload. Keep your API key out of GitHub.

## 2. Connect the repository in Cloudflare

1. In Cloudflare, open **Workers & Pages**, choose **Create application**, and select the **Workers** option to import or connect a Git repository.
2. Connect GitHub, select your private repository, and select its default branch.
3. Set the Worker name to `next-chapter` and use the repository root. Leave the build command blank. Set the deploy command to `npx --yes wrangler@4.46.0 deploy`. Cloudflare runs that command for you.
4. Choose **Deploy** and copy the resulting `workers.dev` URL. Preview URLs are disabled in this configuration.

[Cloudflare Workers Builds with GitHub](https://developers.cloudflare.com/workers/ci-cd/builds/)

## 3. Protect the app and connect AI

1. On the new Worker's **Settings → Domains & Routes** page, configure Cloudflare Access for its domain so only the intended users can sign in. Test the app URL in a signed-out window. Confirm it asks you to sign in before adding the key. If you use another domain, protect that domain too.
2. Open **Settings → Variables and Secrets → Add**. Choose **Secret**, name it `OPENAI_API_KEY`, paste the key in the secret value field, and deploy.
3. Sign in to the new app, open **Discover → Insights**, select sample answers, and choose **Generate AI overview**.

[Cloudflare Access for workers.dev](https://developers.cloudflare.com/workers/configuration/routing/workers-dev/) · [Worker secrets](https://developers.cloudflare.com/workers/configuration/secrets/)

## Updating after launch

Update the GitHub repository and Cloudflare will build the connected branch again. The main entry points are `dist/app.js` for the browser app and `worker/index.js` for AI requests. To keep working with Codex, grant access to the private repository and share its repository link.

The Cloudflare URL has its own browser storage. Export records you want to retain from the Sites deployment. They won’t transfer to another URL automatically.
