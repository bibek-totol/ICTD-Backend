# ICTD-Backend

### setup your postgres database and install beekeeper studio for postgresql admin pannel

### setup project

1. Do prisma migrations

run this command 

``` npx prisma migrate dev --name give-any-name-for-migration ```

And then run this command 

``` npx prisma generate ```

2. rename the .env.sample to .env

3. rename the <username> and <password> with your postgresql username and password

``` DATABASE_URL="postgresql://<username>:<password>@localhost:5432/doict" ```

4. start project ``` npm run dev ```

### If any chnages in prisma.schema then again do properly prisma migrations

run this command 

``` npx prisma migrate dev --name give-any-name-for-migration ```

And then run this command 

``` npx prisma generate ```