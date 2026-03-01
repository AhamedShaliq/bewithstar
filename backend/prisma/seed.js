"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("@prisma/client");
const prisma = new client_1.PrismaClient();
function main() {
    return __awaiter(this, void 0, void 0, function* () {
        const stars = [
            {
                name: 'Elena Silva',
                category: 'Actor',
                country: 'Spain',
                short_bio: 'Award-winning European cinema icon.',
                full_bio: 'Elena Silva is an award-winning actress known for her powerful roles in independent and mainstream cinema. Her captivating performances have established her as one of Europe’s finest talents.',
                image_url: 'https://images.unsplash.com/photo-1534528741775-53994a69daeb?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                availability_status: 'Available',
            },
            {
                name: 'Marcus Chen',
                category: 'Speaker',
                country: 'Singapore',
                short_bio: 'Global tech visionary and keynote speaker.',
                full_bio: 'Marcus Chen frequently delivers sold-out keynotes on the future of AI and sustainable technology. He brings unparalleled insights from over two decades in the tech industry.',
                image_url: 'https://images.unsplash.com/photo-1506794778202-cad84cf45f1d?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                availability_status: 'Available',
            },
            {
                name: 'Sarah Jenkins',
                category: 'Influencer',
                country: 'United Kingdom',
                short_bio: 'Lifestyle & fashion maven.',
                full_bio: 'With over 5 million followers across platforms, Sarah Jenkins redefines modern elegance through her curated lifestyle and fashion content collaborations.',
                image_url: 'https://images.unsplash.com/photo-1524504388940-b1c1722653e1?ixlib=rb-4.0.3&auto=format&fit=crop&w=800&q=80',
                availability_status: 'Booked',
            }
        ];
        for (const star of stars) {
            yield prisma.star.create({
                data: star,
            });
        }
        console.log('Database seeded with sample stars!');
    });
}
main()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.$disconnect();
}));
