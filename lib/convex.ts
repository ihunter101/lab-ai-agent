import { ConvexHttpClient} from "convex/browser";

// creating a singleton inctance of the http client

export const getConvexClient = () =>{
    return new ConvexHttpClient(process.env.NEXT_PUBLIC_CONVEX_URL!);
}