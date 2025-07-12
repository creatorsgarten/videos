import inquirer from 'inquirer';
import { Event } from '../Event';
import { execSync } from 'child_process';

(async () => {
  const events = await Event.findAll()
  const { event, slug, url } = await inquirer.prompt([
    {
      type: 'list',
      name: 'event',
      message: 'Select an event',
      choices: events.reverse().map((event) => ({ name: event.name, value: event.id })),
    },
    {
      type: 'input',
      name: 'slug',
      message: 'Enter the slug of the video',
    },
    {
      type: 'input',
      name: 'url',
      message: 'Enter the URL of the video',
    },
  ])

  execSync(`./bin/import --event ${event} --slug ${slug} --video ${url}`, { stdio: 'inherit' })
})();