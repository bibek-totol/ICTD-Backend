# ICTD-Backend

### setup your postgres database and install beekeeper studio for postgresql admin pannel

### setup project

1. run command ``` npx prisma generate ```

2. rename the .env.sample to .env

3. rename the <username> and <password> with your postgresql username and password

``` DATABASE_URL="postgresql://<username>:<password>@localhost:5432/doict" ```

4. start project ``` npm run dev ```