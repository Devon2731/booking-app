import { startLocationScraping } from './scraping/locationScraping';
import { startPackageScraping } from './scraping/packageScraping';
import {startFlightScarping } from './scraping/flightsScraping';
import { startBookingScraping } from './scraping/HotelScraping';
import prisma from './lib/prisma';

const SBR_WS_ENDPOINT = process.env.SBR_WS_ENDPOINT;

export const register = () => {
    if (process.env.NEXT_RUNTIME === "nodejs") {
        const admin = await prisma.admin.count();
        console.log({admin});
        if (!admin) {
            console.log("in if");
            const data = await prisma.admin.create({
                data: {
                    email: "superadmin@superfly.com",
                    password: "8c6976e5b5410415bde908bd4dee16dfb167a9c873fc4bb8a81f6f2ab448a918",
                },
            });
            console.log({data});
        }

        const { Worker } = await import("bullmq");
        const puppeteer = await import("puppeteer");
        const { connection } = await import("./lib/redis");
        const { importQueue } = await import("./lib/queue");

        new Worker("importQueue", async (job) => {
            console.log(process.env);
            console.log("Connecting to Scraping Browser...", SBR_WS_ENDPOINT);
            const browser = await puppeteer.connect({
                browserWSEndpoint: SBR_WS_ENDPOINT,
            });
            console.log(job.data);

            try {
                const page  = await browser.newPage();
                if (job.data.jobType.type === "location"){
                    console.log ("Connected! Navigating to " + job.data.url);
                    await page.goto(job.data.url);
                    console.log ("Navigated! Scaring page content...");
                    const packages = await startLocationScraping(page);
                    await prisma.jobs.upadate({
                        where: {
                            id: job.data.id
                        },
                        data: {
                            iscomplete: true, status: "success"
                        }
                    });
                    for (const pkg of packages){
                        const jobCreated = await prisma.jobs.findFirst({
                            where: {
                                url: `https://packages.yatra.com/holidays/intl/details.htm?packageId=${pkg?.id}`
                            },
                        });
                        if (!jobCreated) {
                            const job = await prisma.jobs.create({
                                data: {
                                    url: `https://packages.yatra.com/holidays/intl/details.htm?packageId=${pkg?.id}`,
                                    jobType: {
                                        tyoe : "package",
                                    },
                                },
                            }); // Add a comma here
                            importQueue.add("package", {...job, packageDetails: pkg});
                        }   
                            }
                        } else if (job.data.jobType.type === "package"){
                            console.log ("Connected! Navigating to " + job.data.url);
                            await page.goto(job.data.url, {timeout: 120000});
                            console.log ("Navigated! Scaring page content...");
                            const pkg = await startPackageScraping(page, job.data.packageDetails);
                            await prisma.trips.create({
                                data: pkg
                            });
                            await prisma.jobs.update({
                                where: {
                                    id: job.data.id
                                },
                                data: {
                                    iscomplete: true, status: "success"
                                }
                            });
                       } else if (job.data.jobType.type === "flight"){
                        console.log("in flight scraping");
                        console.log ("Connected! Navigating to " + job.data.url);
                        await page.goto(job.data.url);
                        console.log ("Navigated! Scaring page content...");
                        const flight = await startFlightScarping(page);
                        await prisma.job.update({
                            data: flight
                        });
                        await prisma.jobs.update({
                            where: {
                                id: job.data.id
                            },
                            data: {
                                iscomplete: true, status: "success"
                            },
                        });

                        for (const flight of flights) {
                            await prisma.flights.create({
                                data: {
                                    name: flight.airlineName,
                                    logo: flight.airlineLogo,
                                    from:job.data.jobType.source,
                                    to: job.data.jobType.destination,
                                    departureTime: flight.departureTime,
                                    arrivalTime: flight.arrivalTime,
                                    price: flight.price,
                                    duration: flight.flightDuration,
                                    jobId: job.data.id,
                                },
                            });
                        }
                    } else if (job.data.jobType.type === "hotel"){
                        console.log ("Connected! Navigating to " + job.data.url);
                        await page.goto(job.data.url, {timeout: 120000});
                        console.log ("Navigated! Scaring page content...");
                        const hotel = await startBookingScraping(
                            page,
                            browser,
                            job.data.location
                            );

                            console.log(`Scraped Hotel: ${hotel.length} hotels found`);
                            await prisma.job.update({
                                where: {
                                    id: job.data.id,
                                },
                                data: {
                                    iscomplete: true, status: "success"
                                },
                            });

                            console.log("Job Marked as Complete.");
                            console.log("Start Loop for Hotels");
                            for (const hotel of hotels) {
                                await prisma.hotels.create({
                                    data: {
                                        name: hotel.titles,
                                        image: hotel.photo,
                                        price: hotel.price,
                                        jobId: job.data.id,
                                        location: job.data.location.toLowerCase(),
                                    },
                                });
                                console.log(`${hotel.titles} added to database`);
                            }
                            console.log("COMPLETE");
                        }
                    } catch (error) {
                        console.log(error);
                        await prisma.jobs.upadate({
                            where: {
                                id: job.data.id
                            },
                            data: {
                                iscomplete: true, status: "failed"
                            },
                        });
                    } finally {
                       console.log("Closing browser");
                    // await browser.close();{}
                    }
                },
                {
                    connection,
                    concurrency: 10,
                    removeOnComplete: {
                        count: 1000,
                    },
                    removeOnFail: {
                        count: 5000,
                    },
                 }
            );
         }
    }
